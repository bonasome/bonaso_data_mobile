import { View } from 'react-native';
import StyledText from '../styledText';
import Input from './Input';


export default function MultiInt({ name, label, options, value, onChange, error, valueField='value', labelField='label' }){
    // options {value: id, label: name}
    // value: [id]: {value: int, option: fk}
    const setValue = (val, option) => {
        console.log(value, option)
        let toUpdate = value.find(v => v.option == option)
        const left = value.filter(v => v.option != option)
        toUpdate.value = val;
        onChange([...left, toUpdate])
    }
    console.log(options)
    if(!options || options.length ==0) return <View></View>
    return (
        <View>
            <View style={{ display: 'flex', flexDirection: 'row' }}>
                <StyledText>{label} (Enter a number for each category.)</StyledText>
            </View>
            {options.map((o) => {
                return (<View style={{ display: 'flex', flexDirection: 'column' }}>
                    <StyledText>{o.label}</StyledText>
                    <Input name={o.label} onChange={(v) => setValue(v, o.value)} value={value?.find(v => v?.option == o?.value)?.value ?? ''} keyboard={'numeric'} />
                </View>)
            })}
            {error && <StyledText style={styles.errorText}>{error}</StyledText>}
        </View>

    );
}